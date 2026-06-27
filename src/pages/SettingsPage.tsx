import SettingsForm from '../components/SettingsForm'
import ProgramEditor from '../components/ProgramEditor'
import DataManager from '../components/DataManager'
import AppUpdate from '../components/AppUpdate'

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500">Program, goals & data</p>
      </header>
      <ProgramEditor />
      <SettingsForm />
      <DataManager />
      <AppUpdate />
    </div>
  )
}
