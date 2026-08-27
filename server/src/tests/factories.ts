import CompanyModel from "../models/Company.model";
import SiteModel from "../models/Site.model";
import UserModel from "../models/User.model";
import { hashPassword } from "../utils/hash.utils";
import { generateToken } from "../utils/jwt.utils";

export const PASSWORD = "secret123";

/**
 * A complete, self-contained company: one manager, one site, one worker
 * already assigned to that site, plus signed tokens for both users.
 *
 * Isolation tests need two of these and no shared state between them, which
 * is why every value is derived from `label`.
 */
export const createTenant = async (label: string) => {
  const slug = label.toLowerCase();
  const company = await CompanyModel.create({ name: `${label} Ltd` });

  const manager = await UserModel.create({
    name: `${label} Manager`,
    email: `manager@${slug}.test`,
    password: await hashPassword(PASSWORD),
    role: "manager",
    company: company._id,
    isActivated: true,
  });

  const site = await SiteModel.create({
    name: `${label} Site`,
    address: `1 ${label} Road`,
    company: company._id,
    managers: [manager._id],
  });

  const worker = await UserModel.create({
    name: `${label} Worker`,
    email: `worker@${slug}.test`,
    password: await hashPassword(PASSWORD),
    role: "worker",
    company: company._id,
    sites: [site._id],
    occupation: "Electrician",
    isActivated: true,
  });

  await SiteModel.updateOne(
    { _id: site._id },
    { $push: { workers: worker._id } },
  );

  await CompanyModel.updateOne(
    { _id: company._id },
    { $push: { managers: manager._id } },
  );

  return {
    company,
    manager,
    site,
    worker,
    managerToken: generateToken(String(manager._id)),
    workerToken: generateToken(String(worker._id)),
  };
};

export type Tenant = Awaited<ReturnType<typeof createTenant>>;

export const bearer = (token: string) => `Bearer ${token}`;

/**
 * A fresh client address for each call.
 *
 * The rate limiters keep their counters in memory for the life of the
 * process, so tests sharing an address would inherit each other's tally.
 * `trust proxy` is on because the API runs behind one in production, which is
 * what makes X-Forwarded-For the address the limiter counts.
 */
let addressCounter = 0;
export const newClientAddress = () => {
  addressCounter += 1;
  return `203.0.113.${addressCounter % 250}`;
};
