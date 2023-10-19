const injectEngine = require('../utils/injectEngine.js');

async function main() {
    let date = await injectEngine.generateListInjectionWorkDays('2023-10-17', 17, 1,  1, 'IT')
    console.log(date);
    let valid = await injectEngine.InjectWorkDays(17, 1, 'IT', 2023, 'test1');
    console.log(valid);
}

main();



