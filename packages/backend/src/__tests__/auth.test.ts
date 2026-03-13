import assert from 'assert'
import { hashPassword, verifyPassword, generateTotpSecret, verifyTotp } from '../services/auth.js'

async function testPasswordHashing() {
  const password = 'test123'
  const hash = await hashPassword(password)
  
  assert.ok(hash, 'Hash should be generated')
  assert.ok(hash.includes(':'), 'Hash should contain salt delimiter')
  assert.ok(hash.length > 50, 'Hash should be long enough')
  
  const valid = await verifyPassword(password, hash)
  assert.strictEqual(valid, true, 'Correct password should verify')
  
  const invalid = await verifyPassword('wrongpassword', hash)
  assert.strictEqual(invalid, false, 'Wrong password should not verify')
  
  console.log('✓ Password hashing tests passed')
}

async function testTotpSecret() {
  const secret = generateTotpSecret()
  
  assert.ok(secret, 'Secret should be generated')
  assert.strictEqual(secret.length, 16, 'Secret should be 16 characters')
  assert.match(secret, /^[A-Z2-7]+$/, 'Secret should be base32 encoded')
  
  console.log('✓ TOTP secret generation tests passed')
}

async function testTotpVerification() {
  const secret = generateTotpSecret()
  const counter = Math.floor(Date.now() / 1000 / 30)
  
  const code = generateTotpCode(secret, counter)
  assert.ok(code, 'Code should be generated')
  assert.strictEqual(code.length, 6, 'Code should be 6 digits')
  assert.match(code, /^\d{6}$/, 'Code should be numeric')
  
  const valid = verifyTotp(secret, code)
  assert.strictEqual(valid, true, 'Valid code should verify')
  
  const invalidCode = '000000'
  const invalid = verifyTotp(secret, invalidCode)
  assert.strictEqual(invalid, false, 'Invalid code should not verify')
  
  console.log('✓ TOTP verification tests passed')
}

function generateTotpCode(secret: string, counter: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  for (const char of secret) {
    const val = alphabet.indexOf(char)
    if (val === -1) continue
    bits += val.toString(2).padStart(5, '0')
  }

  const key = Buffer.from(bits.match(/.{8}/g)?.map(byte => parseInt(byte, 2)) || [])
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigUInt64BE(BigInt(counter), 0)

  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha1', key)
  hmac.update(counterBuffer)
  const digest = hmac.digest()

  const offset = digest[digest.length - 1] & 0x0f
  const code = ((digest[offset] & 0x7f) << 24 |
                (digest[offset + 1] & 0xff) << 16 |
                (digest[offset + 2] & 0xff) << 8 |
                (digest[offset + 3] & 0xff)) % 1000000

  return code.toString().padStart(6, '0')
}

async function runTests() {
  console.log('Running auth service tests...\n')
  
  await testPasswordHashing()
  await testTotpSecret()
  await testTotpVerification()
  
  console.log('\n✅ All auth service tests passed!')
}

runTests().catch(console.error)
