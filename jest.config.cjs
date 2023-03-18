/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  "transform": {
    '^.+\\.jsx?$': 'babel-jest', 
    '^.+\\.ts?$': 'ts-jest'
  },
  moduleNameMapper:{
    '@/(.*)$': '<rootDir>/src/$1'
  }
};