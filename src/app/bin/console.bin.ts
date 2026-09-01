#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import cfonts from "cfonts";
import { registerValidatorCommand, forceOpticoreColors, helpConfig } from "opticore-validator/cli";
import { registerOrmCommand } from "opticore-orm-orchestrator/cli";
import { registerFeatureCommand } from "opticore-feature-component/cli";

function printBanner(): void {
    cfonts.say("OpticoreJs", {
        font: "block",
        align: "left",
        colors: ["yellow", "#FF6B35"],
        background: "transparent",
        letterSpacing: 1,
        lineHeight: 1,
        space: true,
        maxLength: "0",
    });

    const orange = chalk.bold.hex("#FF6B35");
    const dim    = chalk.bold.yellow;

    console.log(` ${orange("O P T I C O R E")}`);
    console.log(` ${dim("Project CLI — validator, ORM, features, all in one place")}\n`);
}

forceOpticoreColors();
printBanner();

const program = new Command();
program
    .name("opticore")
    .description(chalk.dim("Opticore project CLI"))
    .configureHelp(helpConfig);

registerValidatorCommand(program);
registerOrmCommand(program);
registerFeatureCommand(program);

if (!process.argv.slice(2).length) {
    program.outputHelp();
    process.exit(0);
}

program.parse(process.argv);
