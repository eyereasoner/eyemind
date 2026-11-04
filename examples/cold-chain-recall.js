// A chilled-food distributor receives conflicting temperature readings for a
// handover. Only messages after its checkpoint are considered. For each sample,
// the higher-priority calibrated logger wins: batch A is quarantined, its two
// destinations need notification, and a fresh inspection-task witness is named.
// The example shows scoped evidence selection, explicit absence obligations and
// existential conclusions. Temperatures are integer tenths of a degree Celsius;
// the 8-degree limit is illustrative. No notification or quarantine is executed.

fact(checkpoint(42), temperature_limit(80))
fact(sensor_priority('handheld', 1), sensor_priority('calibrated_logger', 2))
// observation(Id, Sample, Batch, Sequence, Sensor, TemperatureTenthC)
fact(observation('old_b', 'old_handover', 'batch_b', 41, 'calibrated_logger', 120))
fact(observation('handheld_a', 'handover_a', 'batch_a', 43, 'handheld', 72))
fact(observation('logger_a', 'handover_a', 'batch_a', 44, 'calibrated_logger', 94))
fact(observation('logger_b', 'handover_b', 'batch_b', 45, 'calibrated_logger', 75))
fact(destination('batch_a', 'north_depot'), destination('batch_a', 'station_shop'))
fact(destination('batch_b', 'south_depot'))

implies([observation(Id, Sample, Batch, Sequence, Sensor, Temperature), checkpoint(Committed), gt(Sequence, Committed)],
  current_reading(Id, Sample, Batch, Sensor, Temperature))
implies([
  current_reading(_, Sample, Batch, _, Low), current_reading(_, Sample, Batch, _, High),
  temperature_limit(Limit), le(Low, Limit), gt(High, Limit),
], conflicting_sample(Sample, Batch))
implies([
  current_reading(Id, Sample, Batch, Sensor, _), current_reading(_, Sample, Batch, OtherSensor, _),
  sensor_priority(Sensor, Priority), sensor_priority(OtherSensor, OtherPriority), gt(OtherPriority, Priority),
], superseded(Id))
implies([current_reading(Id, _, Batch, _, Temperature), not(superseded(Id))], selected_reading(Id, Batch, Temperature))
implies([selected_reading(Id, Batch, Temperature), temperature_limit(Limit), gt(Temperature, Limit)], quarantine(Batch, Id))
implies([quarantine(Batch, _), destination(Batch, Site)], notify(Site, Batch))
implies(quarantine(Batch, Evidence), inspection_task(Batch, Evidence, Task))

query(selected_reading(Id, Batch, Temperature))
query(conflicting_sample(Sample, Batch))
query(quarantine(Batch, Evidence))
query(notify(Site, Batch))
query(inspection_task(Batch, Evidence, Task))
