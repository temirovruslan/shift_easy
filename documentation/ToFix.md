<!-- FRONTEND -->

- [] choose font proper

- [] In main landing page can be PC version as well since the managers are entering from PC frontend

- [x] Doesnt navigate properly
      <button
      className="flex items-center gap-1 mb-8 hover:opacity-70 transition-opacity"
      onClick={() => navigate("/login/worker")} > // here
      <ChevronLeft size={16} color="#0a84ff" strokeWidth={2.5} />
      <p className="text-blue text-sm">Back</p>
      </button>

- [] Add async loading for buttons frontend when user manipulates date(sends some requests ect)

- [] Fix password doesnt show option IN INPUT frontend to see password user types

-[] WorkerHomePage.tsx - fix it, now it shows data from first site but should be from recent
<p>{data[0].site.name}</p>
<p>{data[0].site.address}</p>

- [] if selling app fix hours i put Math.floor insted of toFix(3) - so now it give clean number insted of real


- [] In manager site page when click on details active workers are not shown correct

- [] Resend  invite email - fix it dosnt show proper pop up

- [] Fix the Shifts manager page grouping might be wrong (logic)

- [] Resend invite email to active worker already is a bug, if active there should be dif logic
<!-- BACKEND -->

- [] worker can start - stop his shift from anywhere, he doesnt need to be Assigned for specific site and only start shift in there


- [] Email invitation better layout


- [] Edit worker from manager side gives error, logic should be diff ex manager 
wants to change just name In that case 

- [] User might close app While he's working and the time should be saved So when he gets into the application time should As ifzz He didn't close the application so that the time should be saved running Without user is in the application because the battery die The phone can be broken or something like that or accidentally they close the application

- [] Profile page for manager

- [] Add React Query (TanStack Query) for client-side caching — currently every page navigation re-fetches all data from API. React Query caches responses and returns them instantly on revisit, only refetching in background when stale. Install: `npm install @tanstack/react-query`. Wrap app in `QueryClientProvider`, replace `useEffect` + `useState` fetches with `useQuery` hooks. Set `staleTime: 60_000` (1 min) on stable data like workers/sites, shorter on shifts. Invalidate cache after mutations (e.g. after adding a worker call `queryClient.invalidateQueries`).

- [] When the worker gets into the manager login accidentally he should be notified It just gets him out from to the main page without saying anything

- [] Check all the inputs and make it user friendly

- [x] log out btn for manager

- [] rewrite in react native

- [] rewrite data fetch in client - react query

<!-- FUTURE FEATURES -->

- [] Dashboard stat cards delta indicators — "+1 vs yesterday" on On shift now card (compare active shifts today vs same time yesterday), "+8h vs avg" on Total hours today (rolling daily average from shift history), "On track" on This week card (compare current week progress vs previous weeks average). All computable from existing shift data.

- [] Manager Shifts page — Custom date range picker (calendar with range selection, "From" and "To" date inputs, Apply range button). Skipped for now due to complexity, needs a calendar library or custom build.

- [] Worker shift history page — worker should be able to see their own past shifts with date, site, duration, notes

- [] Push notifications — notify manager when a worker starts or stops a shift

- []  Swager doc logic is incrorect



----- Other quations ---------



- [] The data should be saved very carefully so the manager the company will not lose it so it will not get lost somewhere if the let's say something happens the database crashes or something like that so we should make 100% assure that they have data and one thing you can save the data every day somewhere