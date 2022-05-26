import './App.css';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

import Fib from './Fib';
import OtherPage from './OtherPage';

function App() {
  return (
    <Router>
      <div className="App">
        <h1>Fib Calculator</h1>
        <div>
          <Link to="/">Home</Link>
          <Link to="/otherpage">Other Page</Link>
        </div>
        <Route exact path="/" component={Fib} />
        <Route path="/otherpage" component={OtherPage} />
      </div>
    </Router>
  );
}

export default App;
