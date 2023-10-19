# [node-red-contrib-you-injector-workdays]

> node for schedulate a send message on only WorkDays, based on the standard injector of NodeRed

## WorkDaysInjector

### Dependencies

* [axios](https://github.com/axios/axios)

* [rrule](https://github.com/jkbrzt/rrule)

* [cronosjs](https://github.com/jaclarke/cronosjs)

* [luxon](https://github.com/moment/luxon)

* [lodash](https://github.com/lodash/lodash)

* [nager.date REST API](https://github.com/nager/Nager.Date)

### Configuration

- `Work Day Number`  : is the number of the working day on which to schedule the execution (e.g., enter 1 for the first working day of the period)

- `WorkDays Of`  : [`YEAR`, `MONTH`, `WEEK`, `DAY`]  Is the period of reference for shedulation

- `Nation` : is the Reference Nation for shedulation (used to manage *Holidays*)

> all other parameters are derived from the standard nodered injector node

### Outputs

1. Standard output
   : `payload` (int) : current timestamp.
   
   : `topic` (string) :  'WorkDays'
   
   :`WorkDays` (boolean) : true
