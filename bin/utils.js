exports.helpAndExit = function (theProgram) {
    theProgram.outputHelp((txt) => {return txt});
    process.exit(1);
};
