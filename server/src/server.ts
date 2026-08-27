// put dotenv file on the topest place so other files can use it, undefined otherwise
import 'dotenv/config'
import app from './app'
import connectDB from './config/connect'
import { env } from './config/env'

const start = async () => {
    try {
        await connectDB()
        app.listen(env.PORT, async () => {
            console.log(`✅✅✅ Server runs at port ${env.PORT} ✅✅✅`)

        })
    }
    catch (error) {
        console.error('DB connection failed:', error)
        process.exit(1)
    }
}


start()