import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
  const payload = { id: userId };
  const secret = process.env.JWT_SECRET;
  const expire = process.env.JWT_EXPIRE || '7d';

  return jwt.sign(payload, secret, { expiresIn: expire });
};

export default generateToken;
