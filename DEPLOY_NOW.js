// FORCE DEPLOY TRIGGER
console.log('DEPLOY MUST HAPPEN NOW!');
const timestamp = new Date().toISOString();
console.log('Timestamp:', timestamp);

// This file change will trigger Vercel deployment
module.exports = {
  deployTime: timestamp,
  version: '0.1.3',
  status: 'CRITICAL_DEPLOY_NEEDED',
  message: 'Receipt system must go live immediately'
};