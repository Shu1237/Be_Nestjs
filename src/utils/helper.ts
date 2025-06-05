import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;


export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const changeVNtoUSD = (total: string): string => {

  const vndAmount = parseFloat(total.replace(/[,\s]/g, ''));

  
  if (isNaN(vndAmount)) {
    throw new Error('Invalid VND amount provided');
  }


  const exchangeRate = 24000;


  const usdAmount = vndAmount / exchangeRate;


  return usdAmount.toFixed(2);
};

export const changeUSDToVN = (total: string): string => {

  const usdAmount = parseFloat(total.replace(/[,\s]/g, ''));

  if (isNaN(usdAmount)) {
    throw new Error('Invalid USD amount provided');
  }

  const exchangeRate = 24000;

  const vndAmount = usdAmount * exchangeRate;

  return vndAmount.toFixed(0);
};