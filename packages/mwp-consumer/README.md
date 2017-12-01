Mock MWP consumer app for platform testing

# Setup

1. Go to the `meetup-web-platform` repo root and run `lerna bootstrap`
2. Go to the `meetup-web-platform/packages/mwp-consumer/` directory and run
   `lerna run build && yarn start | grep "GC HAPPENED"`
3. In a new terminal window, run Apache Bench with a valid member cookie env
   variable, e.g.

   ```
   $ COOKIE='MEETUP_MEMBER_DEV="id=..."'
   $ ab -H Cookie:$COOKIE -l -c 10 -n 3000 https://beta2.dev.meetup.com:8000/
   ```
4. Watch the server logs - you should see periodic "GC HAPPENED" output, and
   eventually something that looks like

   ```
   GC HAPPENED Memory leak detected:
   { growth: 8509368,
    reason: 'heap growth over 5 consecutive GCs (33s) - 885.29 mb/hr' }
  ```

