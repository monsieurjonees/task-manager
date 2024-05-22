import { onLoad } from "./utils";
import { createTaskElement } from "./main";
import { addPlannerTask, createPlannerTaskElement, switchPlannerOrientation } from "./planner"
import { getSettings } from "./storage"
import { addThemeButtonCallbacks, addTabButtonCallbacks, addHelpButtonCallbacks } from "./setup"

function createTaskCallback(event) {
    event.preventDefault()
    var form = event.srcElement
    var title = form.titleinput.value
    var cat = form.catinput.value
    var date = form.deadlineday.value
    var day = form.deadlineday.selectedOptions.item(0).getAttribute("name")
    var bigness = ""

    switch (form.bignessinput.selectedOptions.item(0).getAttribute("name")) {
        case "1":
            bigness = "Not Big"
            break;

        case "2":
            bigness = "A Little Big"
            break;

        case "3":
            bigness = "Medium Big"
            break;
            
        case "4":
            bigness = "Pretty Big"
            break;

        case "5":
            bigness = "Very Big"
            break;
    
        default:
            break;
    }

    var listTask = createTaskElement(title, cat, bigness, date)
    var plannerTask = createPlannerTaskElement(title)

    var deleteTaskCallback = (e) => {
        listTask.remove()
        plannerTask.remove()
    }

    listTask.getElementsByClassName("completed")[0].addEventListener(
        "click",
        deleteTaskCallback
    )
    listTask.getElementsByClassName("deletetask")[0].addEventListener(
        "click",
        deleteTaskCallback
    )

    plannerTask.getElementsByClassName("completed")[0].addEventListener(
        "click",
        deleteTaskCallback
    )

    document.getElementById("tasktab").appendChild(listTask)
    addPlannerTask(plannerTask, day)
}
window.createTaskCallback = createTaskCallback

function highlightCurrentDay() {
    var date = new Date()
    var day = date.getDay()

    var days = document.getElementsByClassName("daycolumn")
    days[day].className += " today"
}

onLoad(async () => {
    addThemeButtonCallbacks()
    addTabButtonCallbacks()
    addHelpButtonCallbacks()

    document.getElementById("switchplanner").addEventListener(
        "click",
        (e) => { switchPlannerOrientation() }
    )

    highlightCurrentDay()
    var settings = await getSettings()
    await changeTheme(settings.lastTheme)
    if (settings.plannerflipped) {
        switchPlannerOrientation()
    }
})




