// Goal-driven planning: find sequences of actions that lead from the current
// state to a goal state within limits on duration, cost, belief (how likely the
// plan is to work), comfort and the number of stages (a stage is a run of steps
// in the same map). The state is a list of fluents, facts that actions can
// change, such as where someone is. Each description is a transition from one
// fluent to a new one, with the action that makes it and what that action
// costs; belief and comfort multiply along a path, duration and cost add.
//
// The test data is a partial map of Belgium with one-way drives between Gent,
// Kortrijk, Brugge and Oostende; durations are in seconds, and cost, belief
// and comfort are illustrative scores. Starting in Gent with the goal of
// being in Oostende, the program finds two routes within the limits: Gent -
// Brugge - Oostende (2400 s, cost 0.01, belief 0.9408, comfort 0.99) and
// Gent - Kortrijk - Brugge - Oostende (4100 s, cost about 0.018, belief
// 0.903168, comfort 0.9801). It reports both; it does not weigh the criteria
// against each other.
//
// The example shows a search written as backward rules with float arithmetic.
// The state is passed along the search, and a transition replaces its From
// fluent by its To fluent. Each step checks the running totals against the
// limits, so a path is cut off as soon as it exceeds one.

// Find paths from the current state to a goal state within the limits,
// starting with no steps, zero duration and cost, and belief and comfort 1.
implied_by(
  findpath(_Scope, [Goal, Path, Duration, Cost, Belief, Comfort, Limits]),
  [
    current_state(State),
    findpaths(
      State,
      [],
      Goal,
      [],
      float(0),
      float(0),
      float(1),
      float(1),
      Path,
      Duration,
      Cost,
      Belief,
      Comfort,
      Limits,
    ),
  ],
)

// A path ends as soon as the goal holds; otherwise it takes one more step.
implied_by(
  findpaths(
    State,
    Maps,
    Goal,
    Path_s,
    Duration_s,
    Cost_s,
    Belief_s,
    Comfort_s,
    Path,
    Duration,
    Cost,
    Belief,
    Comfort,
    Limits,
  ),
  [
    holds(Goal, State, Holds),
    struct(
      'continue',
      Holds,
      State,
      Maps,
      Goal,
      Path_s,
      Duration_s,
      Cost_s,
      Belief_s,
      Comfort_s,
      Path,
      Duration,
      Cost,
      Belief,
      Comfort,
      Limits,
    ),
  ],
)

fact(
  struct(
    'continue',
    'yes',
    _State,
    _Maps,
    _Goal,
    Path,
    Duration,
    Cost,
    Belief,
    Comfort,
    Path,
    Duration,
    Cost,
    Belief,
    Comfort,
    _Limits,
  ),
)
// struct('continue', Holds, ...) decides by whether the goal holds: 'yes'
// ends the path (the fact above), 'no' takes one more step (this rule). Each
// step commits, with once, to the first way of finishing from it.
implied_by(
  struct(
    'continue',
    'no',
    State,
    Maps_s,
    Goal,
    Path_s,
    Duration_s,
    Cost_s,
    Belief_s,
    Comfort_s,
    Path,
    Duration,
    Cost,
    Belief,
    Comfort,
    Limits,
  ),
  [
    unify(Limits, [MaxDuration, MaxCost, MinBelief, MinComfort, MaxStagecount]),
    // a transition whose From fluent is in the state
    description(Map, [From, _Transition, To, Action, Duration_n, Cost_n, Belief_n, Comfort_n]),
    becomes(From, To, State, State_t),
    append(Maps_s, [Map], Maps_t),
    stagecount(Maps_t, Stagecount),
    le(Stagecount, MaxStagecount),
    is(Duration_t, add(Duration_s, Duration_n)),
    le(Duration_t, MaxDuration),
    is(Cost_t, add(Cost_s, Cost_n)),
    le(Cost_t, MaxCost),
    is(Belief_t, mul(Belief_s, Belief_n)),
    ge(Belief_t, MinBelief),
    is(Comfort_t, mul(Comfort_s, Comfort_n)),
    ge(Comfort_t, MinComfort),
    append(Path_s, [Action], Path_t),
    once(
      findpaths(
        State_t,
        Maps_t,
        Goal,
        Path_t,
        Duration_t,
        Cost_t,
        Belief_t,
        Comfort_t,
        Path,
        Duration,
        Cost,
        Belief,
        Comfort,
        Limits,
      ),
    ),
  ],
)

// Whether a fluent of the state matches the goal, binding it to the first that does.
fact(holds(_Goal, [], 'no'))
implied_by(holds(Goal, [Fluent, ..._], 'yes'), unify(Fluent, Goal))
implied_by(
  holds(Goal, [Fluent, ...Fluents], Holds),
  [not_unify(Fluent, Goal), holds(Goal, Fluents, Holds)],
)

// A transition applies to a fluent of the state and replaces it.
implied_by(becomes(From, To, [Fluent, ...Fluents], [To, ...Fluents]), unify(Fluent, From))
implied_by(
  becomes(From, To, [Fluent, ...Fluents], [Fluent, ...Rest]),
  becomes(From, To, Fluents, Rest),
)

// Count the stages: a new stage starts whenever the map changes.
fact(stagecount([_], 1))
implied_by(
  stagecount([Map, Next, ...Maps], Count),
  [identical(Map, Next), stagecount([Next, ...Maps], Count)],
)
implied_by(
  stagecount([Map, Next, ...Maps], Count),
  [not_identical(Map, Next), stagecount([Next, ...Maps], Rest), is(Count, add(Rest, 1))],
)

fact(append([], L, L))
implied_by(append([X, ...Xs], L, [X, ...Ys]), append(Xs, L, Ys))

// test data: partial map of Belgium
// description(Map, [From, Transition, To, Action, Duration, Cost, Belief, Comfort]);
// the search does not use the Transition field
fact(
  description(
    'map_be',
    [
      location(S, 'gent'),
      'true',
      location(S, 'brugge'),
      'drive_gent_brugge',
      float(1500),
      0.006,
      0.96,
      0.99,
    ],
  ),
)
fact(
  description(
    'map_be',
    [
      location(S, 'gent'),
      'true',
      location(S, 'kortrijk'),
      'drive_gent_kortrijk',
      float(1600),
      0.007,
      0.96,
      0.99,
    ],
  ),
)
fact(
  description(
    'map_be',
    [
      location(S, 'kortrijk'),
      'true',
      location(S, 'brugge'),
      'drive_kortrijk_brugge',
      float(1600),
      0.007,
      0.96,
      0.99,
    ],
  ),
)
fact(
  description(
    'map_be',
    [
      location(S, 'brugge'),
      'true',
      location(S, 'oostende'),
      'drive_brugge_oostende',
      float(900),
      0.004,
      0.98,
      float(1),
    ],
  ),
)

// current state
fact(current_state([location('i1', 'gent')]))

// query: be in Oostende, within 5000 s, cost 5, belief at least 0.2,
// comfort at least 0.4, and one stage
query(
  findpath(
    'map_be',
    [
      location(_SUBJECT, 'oostende'),
      _PATH,
      _DURATION,
      _COST,
      _BELIEF,
      _COMFORT,
      [float(5000), float(5), 0.2, 0.4, 1],
    ],
  ),
)
