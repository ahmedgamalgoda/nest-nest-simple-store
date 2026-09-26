import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('An order must contain at least one product.');
    }

    // 1. Validate stock availability and calculate total
    const validatedProducts: {
      product: any;
      quantity: number;
    }[] = [];

    let totalPrice = 0;

    for (const item of createOrderDto.items) {
      const product = await this.prisma.product.where({ id: item.productId }).first();

      if (!product) {
        throw new NotFoundException(`Product with ID "${item.productId}" was not found.`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product "${product.name}". Available: ${product.stock}, requested: ${item.quantity}.`,
        );
      }

      totalPrice += product.price * item.quantity;
      validatedProducts.push({
        product,
        quantity: item.quantity,
      });
    }

    // Round total to 2 decimal places to prevent float issues
    totalPrice = Math.round(totalPrice * 100) / 100;

    // 2. Decrement stock for each product
    for (const entry of validatedProducts) {
      const updatedStock = entry.product.stock - entry.quantity;
      await this.prisma.product.where({ id: entry.product.id }).update({
        stock: updatedStock,
      });
    }

    // 3. Create the order record
    const order = await this.prisma.order.create({
      userId,
      totalPrice,
      status: 'completed',
    });

    // 4. Create individual order item records
    const createdItems = [];
    for (const entry of validatedProducts) {
      const itemRecord = await this.prisma.orderItem.create({
        orderId: order.id,
        productId: entry.product.id,
        quantity: entry.quantity,
        price: entry.product.price,
      });
      createdItems.push({
        id: itemRecord.id,
        productId: entry.product.id,
        productName: entry.product.name,
        quantity: entry.quantity,
        unitPrice: entry.product.price,
        subtotal: Math.round(entry.product.price * entry.quantity * 100) / 100,
      });
    }

    return {
      id: order.id,
      userId: order.userId,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
      items: createdItems,
    };
  }

  async findAllForUser(userId: string) {
    const orders = await this.prisma.order.where({ userId }).all();

    const ordersWithItems = [];
    for (const order of orders) {
      const items = await this.prisma.orderItem.where({ orderId: order.id }).all();
      ordersWithItems.push({
        id: order.id,
        userId: order.userId,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
        items,
      });
    }

    return ordersWithItems;
  }

  async findOneForUser(orderId: string, userId: string) {
    const order = await this.prisma.order.where({ id: orderId }).first();

    if (!order || order.userId !== userId) {
      throw new NotFoundException(`Order with ID "${orderId}" was not found.`);
    }

    const items = await this.prisma.orderItem.where({ orderId: order.id }).all();

    return {
      id: order.id,
      userId: order.userId,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
      items,
    };
  }
}
