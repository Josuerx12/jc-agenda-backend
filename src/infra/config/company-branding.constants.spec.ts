import { DEFAULT_COMPANY_BRAND_COLORS } from './company-branding.constants';

describe('DEFAULT_COMPANY_BRAND_COLORS', () => {
  it('mantém os tokens oficiais da marca', () => {
    expect(DEFAULT_COMPANY_BRAND_COLORS).toEqual({
      primaryColor: '#5B2A6E',
      secondaryColor: '#B56576',
      accentColor: '#D6B36A',
      darkColor: '#221827',
      positiveColor: '#2E8B6D',
      negativeColor: '#C14953',
      infoColor: '#4A7EA8',
      warningColor: '#E3A745',
    });
  });
});
