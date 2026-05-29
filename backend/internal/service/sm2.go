package service

// SM2Input holds the input for the SM-2 algorithm
type SM2Input struct {
	Quality    int     // 0-5: user's recall quality
	Interval   int     // current interval in days
	Repetition int     // current repetition count
	EaseFactor float64 // current ease factor
}

// SM2Output holds the output of the SM-2 algorithm
type SM2Output struct {
	Interval   int
	Repetition int
	EaseFactor float64
}

// CalculateSM2 implements the SM-2 spaced repetition algorithm
// Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
func CalculateSM2(input SM2Input) SM2Output {
	q := input.Quality
	ef := input.EaseFactor
	rep := input.Repetition
	interval := input.Interval

	// Clamp quality to 0-5
	if q < 0 {
		q = 0
	}
	if q > 5 {
		q = 5
	}

	// Update EF: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q)*0.02))
	newEF := ef + (0.1 - float64(5-q)*(0.08+float64(5-q)*0.02))
	if newEF < 1.3 {
		newEF = 1.3 // EF minimum
	}

	if q >= 3 {
		// Successful recall
		if rep == 0 {
			interval = 1
		} else if rep == 1 {
			interval = 6
		} else {
			interval = int(float64(interval) * newEF)
		}
		if interval < 1 {
			interval = 1
		}
		rep++
	} else {
		// Failed recall, restart
		rep = 0
		interval = 1
	}

	return SM2Output{
		Interval:   interval,
		Repetition: rep,
		EaseFactor: newEF,
	}
}
