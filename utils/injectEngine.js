

const { DateTime } = require('luxon');
const fs = require('fs');
const axios = require('axios');
const lodash = require('lodash');
const pkg = require('rrule');


const { RRule } =pkg;

const pathSaved = 'youInjectorData'; 
const filename_Holydays = 'Holydays';
const filename_Timing = 'Timing';
const numberLimitForRecaluator = 6;

const url_api = 'https://date.nager.at/api/v3/publicholidays'

let timeType = {
    YEAR : 0,
    MONTH : 1,
    WEEK : 2,
    DAY: 3
};

async function getHolydaysForNation(nation, year) {
    console.log("GET getHolydaysForNation");
    let result = {};
    let selectYear = year ? year : DateTime.now().toFormat('yyyy');
    if(!nation) {
        throw "You Do not set a nation for calulate Holyday of Injector Days";
    }
    let filename = `${pathSaved}/${filename_Holydays}_${nation.toUpperCase()}_${selectYear.toString()}.json`;
    try {
        if (!fs.existsSync(pathSaved)){
            fs.mkdirSync(pathSaved);
        }

        if(await fs.existsSync(filename)){
            let data =JSON.parse(await fs.readFileSync(filename));
            result = data.value;
            return result;
        }
        else {
            let url = `${url_api}/${selectYear.toString()}/${nation.toUpperCase()}`
            let data = await axios.get(url).then((res)=>{
                return res.data;
            }).catch((e) => {
                throw `Error on Getting Holidays \n ${e}`;
            });

            let fileContent = {
                value : data,
                nation :nation.toUpperCase(),
                year : selectYear.toString(),
                createdAt : DateTime.now().toJSDate(),
            };
            await fs.writeFileSync(filename, JSON.stringify(fileContent));
            result = data;
            return result;
        }
    }
    catch(e) {
        throw e;
    }
} 


async function generateListInjectionWorkDays (dataStart, numberOfRecord,numberOfWorkDay, typeTime, nation) {    
    let typeFreq = (typeTime) => {
        switch (typeTime){
            case timeType.YEAR:
                return RRule.YEARLY;
            case timeType.WEEK:
                return RRule.WEEKLY;
            case timeType.MONTH:
                return RRule.MONTHLY;
            case timeType.DAY:
                return RRule.DAILY;
            default:
                return RRule.MONTHLY;
        }
    };

    let arreyStartDate = dataStart.split('-');
    let listDays = new RRule({
        dtstart : new Date(Date.UTC(+arreyStartDate[0], +arreyStartDate[1]-1, +arreyStartDate[2], 0, 0, 0)),
        freq: typeFreq(typeTime),
        interval: 1,
        count: numberOfRecord,
        byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU],
        bymonthday: [numberOfWorkDay]
    });

    let listYears = lodash.uniq(listDays.all().map((date) => DateTime.fromJSDate(date).toFormat('yyyy')));
    let holidays = {};

    for(let year of listYears) {
        holidays[year] = await getHolydaysForNation(nation, year);
    }

    let result = listDays.all().map((date) => { 
        let isWeekend = (controlDate) =>  controlDate.getDay() == 0 || controlDate.getDay() == 6;
        let isHolidays = (controlDate) => holidays[DateTime.fromJSDate(controlDate).toFormat('yyyy')].some((dateHolidate) => DateTime.fromJSDate(controlDate).toFormat('yyyy-MM-dd') ===  dateHolidate.date);

        while(isWeekend(date) || isHolidays(date)){
            let newDate =  DateTime.fromJSDate(date).plus({ days: 1}).toJSDate();
            date = newDate;
        }
        return date;
    });
    return result.map((date) => DateTime.fromJSDate(date).toFormat('yyyy-MM-dd') );
}

async function InjectWorkDays(numberOfWorkDay, typeTime, nation, year, nodeId) {
    if(!nodeId) {
        throw "You Do not set a NodeID for calulate Injector Days";
    }

    let filename =`${pathSaved}/${filename_Timing}_${nodeId}_${numberOfWorkDay}_${nation}.json`;
    
    try{
        if (!fs.existsSync(pathSaved)){
            fs.mkdirSync(pathSaved);
        }
        if(fs.existsSync(filename)){
            let dataValid = JSON.parse(fs.readFileSync(filename));
            let currentData =  DateTime.now().toFormat('yyyy-MM-dd');
            if(dataValid.some((date) => date == currentData)){
                if(dataValid.length < numberLimitForRecaluator){
                    let newDate = await generateListInjectionWorkDays(dataValid[dataValid.length-1], 24, numberOfWorkDay,  typeTime, nation);
                    dataValid = dataValid.concat(...newDate);                    
                }

                dataValid = dataValid.filter((date) => {
                    return DateTime.fromFormat(date, 'yyyy-MM-dd') >= DateTime.now().minus({ months: 4})
                });
                
                fs.writeFileSync(filename, JSON.stringify(dataValid));
                return true;
            }
            else {
                return false;
            }   
        }
        else {
            console.log("GET list");
            let currentData =  DateTime.now().toFormat('yyyy-MM-dd');
            let dataValid = await generateListInjectionWorkDays(currentData, 24, numberOfWorkDay,  typeTime, nation);
            
            await fs.writeFileSync(filename, JSON.stringify(dataValid));
            return dataValid.some((date) => date == currentData);
        }
    } 
    catch(e) {
        throw e;
    }
}

async function deleteListFile (id) {
    
    let filename =`${pathSaved}/${filename_Timing}_${id}_${numberOfWorkDay}.json`;

    try{
        if (!fs.existsSync(pathSaved)){
            fs.mkdirSync(pathSaved);
        }
        if(fs.existsSync(filename)){
            fs.rmSync(filename);
        }

    }catch(e) {
        throw e;
    }
    
}


module.exports = {
    InjectWorkDays: InjectWorkDays,
    generateListInjectionWorkDays : generateListInjectionWorkDays,
    deleteListFile : deleteListFile,
};
