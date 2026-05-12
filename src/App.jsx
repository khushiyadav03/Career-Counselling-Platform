import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import GetStarted from './pages/GetStarted';
import SetGoals from './pages/SetGoals';
import JobSearch from './pages/JobSearch';
import LearningPath from './pages/LearningPath';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<LearningPath />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/set-goals" element={<SetGoals />} />
        <Route path="/job-search" element={<JobSearch />} />
      </Route>
    </Routes>
  );
}
