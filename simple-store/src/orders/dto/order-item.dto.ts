import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;

  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}
