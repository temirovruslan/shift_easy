// old syntax
// const mongoose = require('mongoose')
// const dns = require('dns')


// new syntax
import mongoose from 'mongoose'
import dns from 'dns'

// use Cloudflare (1.1.1.1) and Google (8.8.8.8) DNS servers
// fixes connection issues in some environments where default DNS fails to resolve MongoDB Atlas hostnames
dns.setServers(['1.1.1.1', '8.8.8.8'])



const connectDB = (url: string) => {
  return mongoose.connect(url) // url comes from MONGO_URI in .env
}

export default connectDB