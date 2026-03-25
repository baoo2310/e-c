import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as productService from '../services/productService';
import { StatusCodes } from 'http-status-codes';
import { CreateProductInput } from '../types/product';
import { z } from 'zod';
import { getProductsQuerySchema } from '../validation/productValidation';

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  // Pass the entire validated body (Product + SKUs array) to the service
  const productWithSkus = await productService.createProductWithSkus(req.body as CreateProductInput);

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    message: 'Product and variants created successfully',
    data: productWithSkus
  });
});

// Add this below your existing createProduct controller

type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;

export const getProducts = catchAsync(async (req: Request<{}, {}, {}, GetProductsQuery>, res: Response) => {
  const { page, limit } = req.query;

  const result = await productService.getProducts(page, limit);

  res.status(StatusCodes.OK).json({
    status: 'success',
    ...result,
  });
});