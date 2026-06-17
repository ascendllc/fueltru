import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gasPriceRouter from "./gasPrice";
import vehicleRouter from "./vehicle";
import distanceRouter from "./distance";
import evDealershipsRouter from "./evDealerships";
import autocompleteRouter from "./autocomplete";
import electricityRateRouter from "./electricityRate";
import tradeInValueRouter from "./tradeInValue";

const router: IRouter = Router();

router.use(healthRouter);
router.use(gasPriceRouter);
router.use(vehicleRouter);
router.use(distanceRouter);
router.use(evDealershipsRouter);
router.use(autocompleteRouter);
router.use(electricityRateRouter);
router.use(tradeInValueRouter);

export default router;
