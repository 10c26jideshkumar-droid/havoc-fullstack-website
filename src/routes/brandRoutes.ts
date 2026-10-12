import { Router, Request, Response, NextFunction } from 'express';
import { BrandService } from '../services/brandService';

const router = Router();

// GET /api/brands - List all brands with optional search and industry filter
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, industry, location, category } = req.query as any;
    const brands = await BrandService.listBrands({ q, industry, location, category });

    res.status(200).json({
      success: true,
      count: brands.length,
      data: brands,
    });
  } catch (error: any) {
    next(error);
  }
});

// GET /api/brands/:id - Get single brand details
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brandId = req.params.id as string;
    const brand = await BrandService.getBrandById(brandId);
    if (!brand) {
      res.status(404).json({
        success: false,
        error: 'Brand not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error: any) {
    next(error);
  }
});

// POST /api/brands - Create a new brand profile
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, industry, description, location } = req.body;
    if (!name || !industry || !description || !location) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, industry, description, location',
      });
      return;
    }

    const brand = await BrandService.createBrand(req.body);
    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: brand,
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
