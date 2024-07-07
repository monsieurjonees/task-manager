import { loadTabs } from './storage'
import { Task } from './task'
import { switchPlannerOrientation } from './planner'
import { changeHelpStuff } from './help'
import { TimerHandler } from "./pomodoro";
import { Settings, SettingsView, TabsActive, onSettingChange, onSettingsLoad } from './settings'
// @ts-ignore
import { addDebugFuncs } from './debug'
import { ProgressBarStatus, getCurrent } from '@tauri-apps/api/window';
import { TaskManager } from "./taskmanager";

const DEBUG_TAB = true
if (DEBUG_TAB) {
    addDebugFuncs()
    document.getElementById("debugtabbutton")!.style.display = "block"
}

var app: App

await loadTabs()

class App {
    // Frontend
        // Nothing here!

    // Backend
    private taskMgr: TaskManager
    private settings: Settings

    // Other
    private pomodoro: TimerHandler | null = null

    constructor() {
        this.taskMgr = new TaskManager()
        this.settings = new Settings()
        new SettingsView(this.settings)
    }
    
    async main() {
        this.taskMgr.start().then()

        // Register callbacks
        document.getElementById("taskcreateform")!.addEventListener(
            "submit",
            (e) => { this.createTaskCallback(e) }
        )
        
        document.getElementById("switchplanner")!.addEventListener(
            "click",
            (_) => { this.switchPlannerCallback() }
        )

        this.addTabButtonCallbacks()
        this.addHelpButtonCallbacks()

        document.getElementById("pomostart")!.addEventListener(
            "click",
            _ => this.pomoStart()
        )

        document.getElementById("pomopause")!.addEventListener(
            "click",
            _ => this.pomoStop(true)
        )

        document.getElementById("pomostop")!.addEventListener(
            "click",
            _ => {
                this.pomoStop()
                this.pomodoro = null
                document.getElementById("pomodorotimer")!.innerHTML = "00:00"
                document.getElementById("pomodorostatus")!.innerHTML = "Cancelled"
                getCurrent().setProgressBar({
                    status: ProgressBarStatus.None
                }).then()
            }
        )

        // @ts-ignore; Populate fields' default values
        document.getElementById("deadlineinput")!.valueAsDate = new Date()
        // @ts-ignore; Populate fields' default values
        document.getElementById("tpsubtaskdateinput")!.valueAsDate = new Date()
        

        onSettingsLoad(() => {
            this.changeTab(this.settings.lastTab)
        })

        onSettingChange(
            "helpTabName",
            e => {
                document.getElementById("helptabbutton")!.innerHTML = e.value
                document.getElementById("helptabheader")!.innerHTML = e.value
                var helpLabels = document.getElementsByClassName("helplabel")
                for (let i = 0; i < helpLabels.length; i++) {
                    const label = helpLabels[i];
                    label.innerHTML = e.value
                }
            }
        )

        onSettingChange(
            "tabsActive",
            e => this.updateTabVisibility(e.value)
        )

        this.settings.load()

        document.body.style.display = "block"

        // DEBUG
        if (DEBUG_TAB) {
            // @ts-ignore
            window.taskMgr = this.taskMgr
        }
    }

    private createTaskCallback(event: SubmitEvent) {
        event.preventDefault()
        
        // @ts-ignore; Necessary to make this whole darn thing work
        var form: HTMLFormElement = event.target
        var title = form.titleinput.value
        var cat = form.catinput.value
        var date = form.deadlineinput.valueAsDate
        var size = form.sizeinput.selectedOptions.item(0).getAttribute("name")
        var importance = form.importanceinput.selectedOptions.item(0).getAttribute("name")

        var box = document.getElementById("taskcreatebox")!
        box.style.scale = "1.03"
        window.setTimeout(() => box.style.scale = "1.0", 100)
        form.reset()
        form.deadlineinput.valueAsDate = new Date()
        
        var task = new Task(title, size, importance, cat, date, false)
        this.taskMgr.addTask(task)
    }

    private switchPlannerCallback() {
        this.settings.plannerFlipped = !this.settings.plannerFlipped
        this.settings.plannerFlipped = switchPlannerOrientation()
    }

    private updateTabVisibility(tabsActive: TabsActive) {
        document.getElementById("plannertabbutton")!.style.display = tabsActive.planner ? "block": "none"
        document.getElementById("tptabbutton")!.style.display = tabsActive.taskplan ? "block": "none"
        document.getElementById("pomodorotabbutton")!.style.display = tabsActive.pomodoro ? "block": "none"
        document.getElementById("eisenhowertabbutton")!.style.display = tabsActive.eisenhower ? "block": "none"
        document.getElementById("dopamenutabbutton")!.style.display = tabsActive.dopamenu ? "block": "none"
        document.getElementById("reminderstabbutton")!.style.display = tabsActive.reminders ? "block": "none"
    }

    /**
     * Switches displayed tab to the target.
     * @param {string} tab Tab Name
     */
    private changeTab(tab: string) {
        var buttons = document.getElementsByClassName("tabbutton")
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            if (button.getAttribute("name") == tab) {
                button.className = "tabbutton active"
            } else if (button.className == "tabbutton active") {
                button.className = "tabbutton"
            }
        }
    
        var tabs = document.getElementsByClassName("tab")
        for (let i = 0; i < tabs.length; i++) {
            const tabElement = tabs[i];
            if (tabElement.getAttribute("name") == tab) {
                tabElement.className = "tab visible"
            } else if (tabElement.className == "tab visible") {
                tabElement.className = "tab"
            }
        }
    }

    private pomoStart() {
        if (this.pomodoro != null && !this.pomodoro.complete) {
            this.pomodoro.start()
        } else {
            // @ts-ignore 2339
            var workTime = Number(document.getElementById("workduratslider")!.value)
            // @ts-ignore 2339
            var breakTime = Number(document.getElementById("breakduratslider")!.value)
            // @ts-ignore 2339
            var repeatTimes = Number(document.getElementById("repeatslider")!.value)

            this.pomodoro = new TimerHandler(repeatTimes, workTime, breakTime, () => {this.pomodoro = null})
            this.pomodoro.start()
        }
    }

    private pomoStop(pausing: boolean = false) {
        if (this.pomodoro == null || this.pomodoro.complete) { return }
        this.pomodoro.stop()
        if (pausing) {
            document.getElementById("pomodorotimer")!.innerHTML += " ⏸️"
        }
    }

    /** Assign as click callback to tab change buttons. */
    private tabChangeCallback(event: Event) {
        // @ts-ignore
        var button: HTMLButtonElement = event.currentTarget
        var tab = button.name
        this.changeTab(tab)
        this.settings.lastTab = tab
    }

    private addTabButtonCallbacks() {
        var tabChangeCallback = (e: Event) => {
            this.tabChangeCallback(e)
        }

        var tabButtons = document.getElementsByClassName("tabbutton");
        for (let i = 0; i < tabButtons.length; i++) {
            const button = tabButtons[i];
            button.addEventListener("click", tabChangeCallback);
        }
    }

    private addHelpButtonCallbacks() {
        var helpButtons = document.getElementsByClassName("helpbutton")
        for (let i = 0; i < helpButtons.length; i++) {
            const button = helpButtons[i];
            button.addEventListener(
                "click",
                (e) => {
                    // @ts-ignore
                    changeHelpStuff(e.currentTarget!.getAttribute("name"))
                }
            )
        }
    }
}

app = new App()
await app.main()