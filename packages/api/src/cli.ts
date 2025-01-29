import "reflect-metadata";
import { mkdirSync, existsSync } from "fs";
import "./configurations/env.conf";

import FonjepCli from "./interfaces/cli/Fonjep.cli";
import FonjepCliOld from "./interfaces/cli/Fonjep.cli.old";
import ChorusCli from "./interfaces/cli/Chorus.cli";
import OsirisCli from "./interfaces/cli/Osiris.cli";
import UserCli from "./interfaces/cli/User.cli";
import ConsumerCli from "./interfaces/cli/Consumer.cli";
import { connectDB } from "./shared/MongoConnection";

import { CliStaticInterface } from "./@types";

import SubventiaCli from "./interfaces/cli/Subventia.cli";
import DemarchesSimplifieesCli from "./interfaces/cli/DemarchesSimplifiees.cli";
import CaisseDepotsCli from "./interfaces/cli/CaisseDepots.cli";
import GisproCli from "./interfaces/cli/Gispro.cli";
import DauphinCli from "./interfaces/cli/Dauphin.cli";
import AdminStructureCli from "./interfaces/cli/AdminStructure.cli";
import DumpCli from "./interfaces/cli/Dump.cli";
import ScdlCli from "./interfaces/cli/Scdl.cli";
import HistoryUniteLegalCli from "./interfaces/cli/HistoryUniteLegal.cli";
import { initIndexes } from "./shared/MongoInit";
import GeoCli from "./interfaces/cli/Geo.cli";
import DataBretagneCli from "./interfaces/cli/DataBretagne.cli";
import PaymentFlatCli from "./interfaces/cli/PaymentFlat.cli";
import SireneStockUniteLegaleCli from "./interfaces/cli/SireneStockUniteLegale.cli";
import AmountsVsProgrammeRegionCli from "./interfaces/cli/AmountsVsProgramRegion.cli";
async function main() {
    await connectDB();
    await initIndexes();

    if (!existsSync("./logs")) {
        mkdirSync("./logs");
    }

    const controllers: CliStaticInterface[] = [
        OsirisCli,
        UserCli,
        ChorusCli,
        FonjepCli,
        FonjepCliOld,
        SubventiaCli,
        ConsumerCli,
        DemarchesSimplifieesCli,
        CaisseDepotsCli,
        GisproCli,
        DauphinCli,
        AdminStructureCli,
        DumpCli,
        ScdlCli,
        HistoryUniteLegalCli,
        GeoCli,
        DataBretagneCli,
        PaymentFlatCli,
        SireneStockUniteLegaleCli,
        AmountsVsProgrammeRegionCli,
    ];

    const args = process.argv.slice(2);

    const Controller = controllers.find(controller => controller.cmdName === args[0]);

    if (!Controller) {
        throw new Error(`Controller ${args[0]} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = new Controller() as any;

    if (!instance[args[1]]) {
        throw new Error(`Method ${args[1]} not found in controller ${args[0]}`);
    }

    const result = instance[args[1]].call(instance, ...args.slice(2));

    if (result instanceof Promise) {
        result.catch(console.error).finally(() => process.exit());
    }
}

main();
