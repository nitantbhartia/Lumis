import { calculateVitaminD, calculateLightQuality } from '../lib/bio-metrics';

describe('Bio-Metrics Calculations', () => {
    describe('calculateVitaminD', () => {
        test('should return 0 when UV index is less than 1', () => {
            expect(calculateVitaminD(0.5, 30, 2)).toBe(0);
            expect(calculateVitaminD(0, 60, 1)).toBe(0);
        });

        test('should calculate synthesis correctly for various skin types', () => {
            // Type 1 skin (multipler 1.0)
            const type1 = calculateVitaminD(5, 20, 1); // 40 * 5 * 20 * 0.25 / 1.0 = 1000
            expect(type1).toBe(1000);

            // Type 4 skin (multiplier 2.0)
            const type4 = calculateVitaminD(5, 20, 4); // 40 * 5 * 20 * 0.25 / 2.0 = 500
            expect(type4).toBe(500);
        });

        test('should factor in exposure duration', () => {
            const short = calculateVitaminD(5, 10, 2);
            const long = calculateVitaminD(5, 20, 2);
            expect(long).toBe(short * 2);
        });
    });

    describe('calculateLightQuality', () => {
        test('should give "Biological Gold" for high lux early morning', () => {
            const result = calculateLightQuality(12000, 30);
            expect(result.label).toBe('Biological Gold');
            expect(result.score).toBe(100);
        });

        test('should give "High Impact" for mid-morning bright light', () => {
            const result = calculateLightQuality(5000, 90);
            expect(result.label).toBe('High Impact');
            expect(result.score).toBe(60); // 30 (lux) + 30 (time)
        });

        test('should give "Low Impact" for low light late morning', () => {
            const result = calculateLightQuality(500, 300);
            expect(result.label).toBe('Low Impact');
            expect(result.score).toBe(0);
        });
    });
});
