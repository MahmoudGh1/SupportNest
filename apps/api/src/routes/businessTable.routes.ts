import express, { type Router } from "express"
import { deleteRowController, deleteTableController, fetchPreviewController, getTableRowsController, listTablesController, saveTableController, updateRowController } from "src/controllers/businessTable.controller.js";

const router: Router = express.Router();


router.post("/fetch-preview", fetchPreviewController);

router.post("/", saveTableController);

router.get("/", listTablesController);

router.delete("/:tableId", deleteTableController);

router.get("/:tableId/rows", getTableRowsController);

router.patch("/:tableId/rows/:rowId", updateRowController);

router.delete("/:tableId/rows/:rowId", deleteRowController);

export default router;
