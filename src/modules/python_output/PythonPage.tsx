import { Practice } from '../shared/Practice';
import { pythonCorpus, pythonExercise, pythonUnits } from './domain';
export function PythonPage() {
  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">Mental execution</p>
        <h1>Python-hjernen</h1>
        <p>
          {pythonUnits.length} korte programmer om de regler, der stadig kan overraske en
          programmør. Facit er kørt tre gange med Python {pythonCorpus.pythonVersion}.
        </p>
      </header>
      <Practice units={pythonUnits} generate={pythonExercise} />
    </div>
  );
}
