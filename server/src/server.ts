// put dotenv file on the topest place so other files can use it, undefined otherwise
import 'dotenv/config'
import app from './app'
import connectDB from './config/connect'

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI!)
        app.listen(process.env.PORT, async () => {
            console.log(`✅✅✅ Server runs at port ${process.env.PORT} ✅✅✅`)

        })
    }
    catch (error) {
        console.error('DB connection failed:', error)
        process.exit(1)
    }
}


start()