BEGIN {
	alphaTrace=0;
	TRACE_FULL_HISTORY=1;
	TRACE_CONVERGENCE_VALUES=0;
	TRACE_BEST_ACTION=0;
	alphaValues[1]="0.0";
	alphaValues[2]="1.0";
	alphaValues[3]="0.8";
	alphaValues[4]="0.6";
	alphaValues[5]="0.4";
	alphaValues[6]="0.2";
	transient=14000;
	dummyConf[0]=1
	dummyConf[1]=2
	dummyConf[2]=4
	dummyConf[3]=8
	pertConf[0]=1
	pertConf[1]=2
	pertConf[2]=4
	alphaInterest=2
	alphaDiscard=0

}

	{	
		if ($3=="START") {
			alphaTrace+=1;
			print alphaTrace;
		}

		if (($1=="[REW]") && ((alphaTrace-alphaDiscard)>=1)) {
			alphaTrace2=alphaTrace-alphaDiscard;
			counter[alphaTrace2,$3]+=1
			value[alphaTrace2,$3]+=$5
			maxTime[alphaTrace2]=$3
			if ($3 > transient) {
				pp[alphaTrace2]+=$7
				numSamples[alphaTrace2]+=1
				if ($9==0.3) {
					un[alphaTrace2]+=1	
					#sa[alphaTrace]+=0.3
				} else {
					sa[alphaTrace2]+=$9
					k[alphaTrace2]+=1
				}
	
			}
				 
		}
		if (($1=="BestAction:") && (maxTime[alphaTrace-alphaDiscard]>transient) && (alphaTrace==alphaInterest)) {
			action[$4,$6]+=1;
			numAction+=1;
		}
	}

END {
	
	if (TRACE_FULL_HISTORY) {
		alphaInterest=alphaInterest-alphaDiscard;
		for (i=0; i<maxTime[alphaInterest]; i++)
			if (value[alphaInterest,i]>0)
				print alphaValues[i]," ",i," ",(value[alphaInterest,i]/counter[alphaInterest,i])
	}

	if (TRACE_CONVERGENCE_VALUES) {
		for (i=1; i<=6; i++)
			if (numSamples[i]>0)
				print alphaValues[i]," ",i," ",(pp[i]/numSamples[i])," ",(sa[i]/numSamples[i])," ",un[i]," ",k[i]
	}

	if (TRACE_BEST_ACTION) {
		for (i=0; i<4; i++)
			for (j=0; j<3; j++)
				print dummyConf[i]," ",pertConf[j]," ",action[dummyConf[i],pertConf[j]]/numAction;
	}

}
