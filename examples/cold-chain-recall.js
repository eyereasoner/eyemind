// A chilled-food distributor receives temperature readings taken when its
// batches change hands, and two sensors disagree about batch A. Only messages
// numbered after the checkpoint, the last message already processed, count.
// When two sensors read the same sample, the calibrated logger outranks the
// handheld thermometer. The program concludes that batch A, read at 9.4
// degrees, is quarantined, that its two destinations must be notified, and
// that an inspection task exists for it; batch B, at 7.5 degrees, passes.
//
// It shows forward rules that select evidence, a negation (not) that the proof
// records as an absence a checker can verify, and a conclusion with a variable
// only the conclusion mentions: the task, which eyemind names with a new
// placeholder term (a Skolem term). Temperatures are integer tenths of a degree
// Celsius; the 8-degree limit is illustrative. Nothing is actually notified or
// quarantined.

fact(checkpoint(42), temperature_limit(80))
fact(sensor_priority('handheld', 1), sensor_priority('calibrated_logger', 2))
// observation(Id, Sample, Batch, Sequence, Sensor, TemperatureTenthC)
fact(observation('old_b', 'old_handover', 'batch_b', 41, 'calibrated_logger', 120))
fact(observation('handheld_a', 'handover_a', 'batch_a', 43, 'handheld', 72))
fact(observation('logger_a', 'handover_a', 'batch_a', 44, 'calibrated_logger', 94))
fact(observation('logger_b', 'handover_b', 'batch_b', 45, 'calibrated_logger', 75))
fact(destination('batch_a', 'north_depot'), destination('batch_a', 'station_shop'))
fact(destination('batch_b', 'south_depot'))

// Only messages after the checkpoint are current.
implies([observation(Id, Sample, Batch, Sequence, Sensor, Temperature), checkpoint(Committed), gt(Sequence, Committed)],
  current_reading(Id, Sample, Batch, Sensor, Temperature))
// A sample conflicts when one current reading is within the limit and another
// is above it.
implies([
  current_reading(_, Sample, Batch, _, Low), current_reading(_, Sample, Batch, _, High),
  temperature_limit(Limit), le(Low, Limit), gt(High, Limit),
], conflicting_sample(Sample, Batch))
// A reading is superseded when a higher-priority sensor read the same sample.
implies([
  current_reading(Id, Sample, Batch, Sensor, _), current_reading(_, Sample, Batch, OtherSensor, _),
  sensor_priority(Sensor, Priority), sensor_priority(OtherSensor, OtherPriority), gt(OtherPriority, Priority),
], superseded(Id))
// The readings that count are those nothing supersedes.
implies([current_reading(Id, _, Batch, _, Temperature), not(superseded(Id))], selected_reading(Id, Batch, Temperature))
// A selected reading above the limit quarantines its batch, every destination
// of that batch is notified, and each quarantine gets an inspection task:
// Task appears only in the conclusion, so the task is a new named term.
implies([selected_reading(Id, Batch, Temperature), temperature_limit(Limit), gt(Temperature, Limit)], quarantine(Batch, Id))
implies([quarantine(Batch, _), destination(Batch, Site)], notify(Site, Batch))
implies(quarantine(Batch, Evidence), inspection_task(Batch, Evidence, Task))

query(selected_reading(Id, Batch, Temperature))
query(conflicting_sample(Sample, Batch))
query(quarantine(Batch, Evidence))
query(notify(Site, Batch))
query(inspection_task(Batch, Evidence, Task))
