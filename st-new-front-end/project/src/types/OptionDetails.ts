

export interface OptionDetails {
    usymbol: string;
    expirationDate: string;
    optionType: 'CALL' | 'PUT';
    strikePrice: number;
  }

  export default OptionDetails;