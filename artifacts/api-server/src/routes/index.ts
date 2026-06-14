import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gasPriceRouter from "./gasPrice";
import vehicleRouter from "./vehicle";
import distanceRouter from "./distance";

const router: IRouter = Router();

router.use(healthRouter);
router.use(gasPriceRouter);
router.use(vehicleRouter);
router.use(distanceRouter);

export default router;
