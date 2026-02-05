import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SRSReview from "./pages/SRSReview";
import WritingPractice from "./pages/WritingPractice";
import VideoLearning from "./pages/VideoLearning";
import DailyContent from "./pages/DailyContent";
import AICourseGenerator from "./pages/AICourseGenerator";
import MyCourses from "./pages/MyCourses";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/srs"} component={SRSReview} />
      <Route path={"/writing"} component={WritingPractice} />
      <Route path={"/videos"} component={VideoLearning} />
      <Route path={"/daily-content"} component={DailyContent} />
      <Route path={"/ai-course"} component={AICourseGenerator} />
      <Route path={"/my-courses"} component={MyCourses} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
