import mongoose from 'mongoose'
import dns from 'dns'
import { z } from 'zod'

/**
 * Database settings, validated separately from the HTTP application's
 * environment so that a process which never opens a connection — the test
 * suite, which runs against an in-memory server — is not asked for them.
 */
const schema = z.object({
    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

    // Some networks cannot resolve the SRV and TXT records a mongodb+srv URI
    // depends on, and the fix is to point Node at a resolver that can. Public
    // resolvers used to be hard coded here, which forced that workaround on
    // every environment, including ones where outbound DNS is restricted on
    // purpose. Comma separated, empty by default.
    DNS_SERVERS: z
        .string()
        .default('')
        .transform((value) =>
            value
                .split(',')
                .map((server) => server.trim())
                .filter(Boolean),
        ),
})

const connectDB = () => {
    const parsed = schema.safeParse(process.env)

    if (!parsed.success) {
        const problems = Object.entries(parsed.error.flatten().fieldErrors)
            .map(([key, errors]) => `  ${key}: ${errors?.join(', ')}`)
            .join('\n')
        throw new Error(`Invalid database configuration:\n${problems}`)
    }

    if (parsed.data.DNS_SERVERS.length > 0) {
        dns.setServers(parsed.data.DNS_SERVERS)
    }

    return mongoose.connect(parsed.data.MONGO_URI)
}

export default connectDB
