import { Response, Request } from "express";
import SiteModel from "../models/Site.model";
import AppError from "../errors/AppError";

export const createSite = async (req: Request, res: Response) => {
  const { name, address } = req.body;
  const newSite = await SiteModel.create({
    name,
    address,
    company: req.user.company,
  });
  res.status(201).json({ success: true, data: newSite });
};

export const getActiveSites = async (req: Request, res: Response) => {
  const manager = req.user;

  const sites = await SiteModel.find({
    company: manager.company,
  }).populate("workers", "name")
  res.status(200).json({ success: true, data: sites });
};

export const getSite = async (req: Request, res: Response) => {
  const _id = req.params.id;
  const manager = req.user;

  const singleSite = await SiteModel.findOne({
    _id,
    company: manager.company,
  }).populate("workers", "name");
  if (!singleSite) throw new AppError("Not founed site", 400);
  res.status(200).json({ success: true, data: singleSite });
};

export const updateSite = async (req: Request, res: Response) => {
  const _id = req.params.id;
  const company = req.user.company;

  const { name, address } = req.body;

  const updatedSite = await SiteModel.findOneAndUpdate(
    { _id, company },
    { name, address },
    { new: true },
  );

  if (!updatedSite) throw new AppError("Site not found", 404);
  res.status(200).json({ success: true, data: updatedSite });
};

export const getArchivedSites = async (req: Request, res: Response) => {
  const manager = req.user;

  const sites = await SiteModel.find({
    company: manager.company,
    status: "archived",
  });
  res.status(200).json({ success: true, data: sites });
};

export const archiveSite = async (req: Request, res: Response) => {
  const _id = req.params.id;
  const company = req.user.company;

  const updateSite = await SiteModel.findOneAndUpdate(
    { _id, company },
    { status: "archived" },
    { new: true },
  );

  if(!updateSite) throw new AppError("Something went wrong", 400)
  res.status(200).json({ success: true, data: { updateSite } });
};

export const activateSite = async (req: Request, res: Response) => {
  const _id = req.params.id;
  const company = req.user.company;

  const updateSite = await SiteModel.findOneAndUpdate(
    { _id, company },
    { status: "active" },
    { new: true },
  );

  if(!updateSite) throw new AppError("Something went wrong", 400)
  res.status(200).json({ success: true, data: { updateSite } });
};
