# Decisions

Business rules settled in Jira (project TSTAPP) that the code alone does not
explain. Each record says what was decided, why, and what follows from it.
Apply them to every new story. Only change one when a Jira story explicitly
changes the rule, and update the record in the same PR.

| #                               | Decision                                                                         | Source                                 |
| ------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------- |
| [0001](0001-eur-to-usd.md)      | Convert EUR prices to USD at the ECB rate, with no retail rounding               | TSTAPP-2, TSTAPP-3, TSTAPP-4           |
| [0002](0002-size-mapping.md)    | Map store sizes to the closest vocabulary size and never extend the vocabulary   | TSTAPP-2, TSTAPP-3, TSTAPP-4           |
| [0003](0003-distinct-images.md) | Front and back product images must differ                                        | TSTAPP-2, TSTAPP-3, TSTAPP-4, TSTAPP-5 |
| [0004](0004-size-optional.md)   | Size is optional (`availableSizes: []`); size-less products pass the size filter | TSTAPP-5, TSTAPP-6                     |
