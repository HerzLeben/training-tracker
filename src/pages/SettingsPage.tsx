import SettingsForm from '../components/SettingsForm'
import ExerciseManager from '../components/ExerciseManager'
import DataManager from '../components/DataManager'

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-slate-400">Frequency, goals, exercises & data</p>
      </header>
      <SettingsForm />
      <ExerciseManager />
      <DataManager />
    </div>
  )
}
