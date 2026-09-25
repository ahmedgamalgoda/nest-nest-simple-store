import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    return await this.prisma.product.create({
      name: createProductDto.name,
      description: createProductDto.description ?? null,
      price: createProductDto.price,
      stock: createProductDto.stock ?? 0,
    });
  }

  async findAll() {
    return await this.prisma.product.all();
  }

  async findOne(id: string) {
    const product = await this.prisma.product.where({ id }).first();
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" was not found.`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);
    return await this.prisma.product.where({ id }).update(updateProductDto);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.prisma.product.where({ id }).delete();
    return {
      message: `Product with ID "${id}" was successfully deleted.`,
      product,
    };
  }
}
