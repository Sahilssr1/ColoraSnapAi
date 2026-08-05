import { barcodeService } from '../../src/services/barcode.service';
import { foodRepository } from '../../src/repositories/food.repository';
import { redisCache } from '../../src/config/redis';

jest.mock('../../src/repositories/food.repository');
jest.mock('../../src/config/redis');

describe('BarcodeService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns cached food if present in redis', async () => {
    const mockFood: any = {
      id: 'f1',
      name: 'Organic Rolled Oats',
      barcode: '039978001153',
      calories: 150,
      protein: 5,
    };

    (redisCache.get as jest.Mock).mockResolvedValue(mockFood);

    const result = await barcodeService.lookupBarcode('039978001153');

    expect(result.found).toBe(true);
    expect(result.food?.name).toBe('Organic Rolled Oats');
    expect(result.source).toBe('LOCAL_DB');
  });

  it('prompts photo scan when barcode is not found anywhere', async () => {
    (redisCache.get as jest.Mock).mockResolvedValue(null);
    (foodRepository.findByBarcode as jest.Mock).mockResolvedValue(null);

    const result = await barcodeService.lookupBarcode('9999999999999');

    expect(result.found).toBe(false);
    expect(result.suggestPhotoScan).toBe(true);
  });
});
