export interface AddressResponse {
  zipCode: string;
  street: string;
  complement: string | null;
  neighborhood: string | null;
  city: {
    id: string;
    name: string;
  };
  state: {
    id: string;
    name: string;
    code: string;
  };
}
