
const injectEngine = require('../utils/injectEngine.js');
const pkg = require('cronosjs');

//import pkg  from 'cronosjs';
const {scheduleTask} = pkg;

module.exports = function(RED) {
    "use strict";

    function WorkDaysInjectorNode(n) {
        RED.nodes.createNode(this,n);

        this.props = n.props;
        this.repeat = n.repeat;
        this.crontab = n.crontab;
        this.numberOfWorkDay = n.numberOfWorkDay;
        this.typeTime = n.typeTime;
        this.nation = n.nation;
        this.once = n.once;
        this.onceDelay = (n.onceDelay || 0.1) * 1000;
        this.interval_id = null;
        this.cronjob = null;
        var node = this;

        if (node.repeat > 2147483) {
            node.error(RED._("WorkDaysInjector.errors.toolong", this));
            delete node.repeat;
        }

        node.repeaterSetup = function () {
            if (this.repeat && !isNaN(this.repeat) && this.repeat > 0) {
                this.repeat = this.repeat * 1000;
                this.debug(RED._("WorkDaysInjector.repeat", this));
                this.interval_id = setInterval(function() {
                    node.emit("input", {});
                }, this.repeat);
            } else if (this.crontab) {
                this.debug(RED._("WorkDaysInjector.crontab", this));
                this.cronjob = scheduleTask(this.crontab,() => { node.emit("input", {})});
            }
        };

        if (this.once) {
            this.onceTimeout = setTimeout( function() {
                node.emit("input",{});
                node.repeaterSetup();
            }, this.onceDelay);
        } else {
            node.repeaterSetup();
        }

        this.on("input", async function(msg, send, done) {
            msg.topic = "WorkDays";
            msg.WorkDays = true;
            msg.payload = new Date().getTime();
            try {
                if(await injectEngine.InjectWorkDays(parseInt(this.numberOfWorkDay), parseInt(this.typeTime), this.nation.toUpperCase(), new Date().getFullYear(), node.id)){
                    send(msg);
                }
            }
            catch (e) {
                console.log(e);
            }
            done();
        });
    }

    RED.nodes.registerType("WorkDaysInjector",WorkDaysInjectorNode);

    WorkDaysInjectorNode.prototype.close = function() {
        if (this.onceTimeout) {
            clearTimeout(this.onceTimeout);
        }
        if (this.interval_id != null) {
            clearInterval(this.interval_id);
        } else if (this.cronjob != null) {
            this.cronjob.stop();
            delete this.cronjob;
        }
    };

    RED.httpAdmin.post("/workInjector/:id", RED.auth.needsPermission("inject.write"), function(req,res) {
        var node = RED.nodes.getNode(req.params.id);
        if (node != null) {
            try {
                node.send(req.body);
                res.sendStatus(200);
            } catch(err) {
                res.sendStatus(500);
                node.error(RED._("inject.failed",{error:err.toString()}));
            }
        } else {
            res.sendStatus(404);
        }
    });
}