import { BrowserRouter } from "react-router-dom"
import { Route, Routes } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import WorkerLoginPage from "./pages/WorkerLoginPage"
import ManagerLoginPage from "./pages/ManagerLoginPage"
import RegisterPage from "./pages/RegisterPage"
import ManagerDashboardPage from "./pages/ManagerDashboardPage"
import WorkerHomePage from "./pages/WorkerHomePage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import ActivatePage from "./pages/ActivatePage"
import ProtectedRoute from "./components/ProtectedRoute"
import WorkerHistoryPage from "./pages/WorkerHistoryPage"


function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/login/worker' element={<WorkerLoginPage/>} />
          <Route path='/login/manager' element={<ManagerLoginPage/>} />
          <Route path='/register' element={<RegisterPage/>} />
          <Route path='/activate/:token' element={<ActivatePage/>} />
          <Route path='/forgot-password' element={<ForgotPasswordPage/>} />
          <Route path='/reset-password/:token' element={<ResetPasswordPage/>} />

          <Route path='/worker/home' element={<ProtectedRoute role="worker"><WorkerHomePage/></ProtectedRoute>} />
          <Route path='/worker/history' element={<ProtectedRoute role="worker"><WorkerHistoryPage/></ProtectedRoute>} />

          <Route path='/manager/dashboard' element={<ProtectedRoute role="manager"><ManagerDashboardPage/></ProtectedRoute>} />
          <Route path='/manager/shifts' element={<ProtectedRoute role="manager"><div>manager/shifts</div></ProtectedRoute>} />
          <Route path='/manager/workers' element={<ProtectedRoute role="manager"><div>manager/workers</div></ProtectedRoute>} />
          <Route path='/manager/sites' element={<ProtectedRoute role="manager"><div>manager/sites</div></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
