import { resolveResource } from '@tauri-apps/api/path'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { setLastTheme, getTasksChanged, loadTasks } from './storage'
import { Task, TaskList } from './task'
import { Planner } from './planner'
import { onLoad } from './utils'

export async function changeTheme(theme: string) {
    const previousTheme = document.getElementById("themesheet")
    if (previousTheme != null) {
        document.head.removeChild(previousTheme)
    }

    if (theme != "light") {
        const themeFile = await resolveResource(`../src/themes/${theme}.css`)
        const themeCode = await readTextFile(themeFile) 

        var newTheme = document.createElement("style")
        newTheme.id = "themesheet"
        newTheme.innerHTML = themeCode
        document.head.appendChild(newTheme)
    }

    await setLastTheme(theme)
}

/**
 * The Task Manager. The closest we have to a class representing the whole app.
 */
export class TaskManager {
    private tasks: Task[] = []

    private taskList: TaskList
    private planner: Planner

    constructor() {
        this.taskList = new TaskList(this)
        this.planner = new Planner(this)

        onLoad(async () => {
            await this.onLoadCallback()
        })
    }

    private async onLoadCallback() {
        await this.loadTasks()
        this.render()
    }

    private async loadTasks() {
        this.tasks = await loadTasks()
        for (let index = 0; index < this.tasks.length; index++) {
            const task = this.tasks[index];
            task.completeCallback = () => { this.refresh() }
            task.deleteCallback = () => { this.refresh() }
        }

        this.render()
    }

    private saveTasksViaEvent() {
        window.dispatchEvent(getTasksChanged(this.tasks))
    }

    private render() {
        this.taskList.render()
        this.planner.render()
    }

    private refresh() {
        this.taskList.refresh()
        this.planner.refresh()

        this.saveTasksViaEvent()
    }

    getTasks() {
        return [...this.tasks]
    }

    addTask(task: Task) {
        this.tasks.push(task)

        task.completeCallback = () => { this.refresh() }
        task.deleteCallback = () => { this.refresh() }

        this.planner.addTask(task)
        this.taskList.addTask(task)

        this.saveTasksViaEvent()
    }
}