BEGIN {
	alphaTrace=0;
	TRACE_FULL_HISTORY=0;
	TRACE_CONVERGENCE_VALUES=1;
	alphaValues[1]="1.0";
	alphaValues[2]="0.0";
	alphaValues[3]="0.8";
	alphaValues[4]="0.6";
	alphaValues[5]="0.4";
	alphaValues[6]="0.2";
	transient=3000;
	cNode=0;

}

	{	
		if ($3=="START") {
			alphaTrace+=1;
		}

		if (($1=="[REW]") && ($11>1) && ($13>=1)) {
			counter[alphaTrace,$3]+=1
			value[alphaTrace,$3]+=$5
			maxTime[alphaTrace]=$3
			if (($3 <= transient)) {
				pp[alphaTrace]+=$7
				numSamples[alphaTrace]+=1
				if ($9==0.3) {
					un[alphaTrace]+=1	
					sa[alphaTrace]+=0.3
				} else {
					sa[alphaTrace]+=$9
					k[alphaTrace]+=1
				}
	
			}
			
				 
		}

				
	}

END {
	
	if (TRACE_FULL_HISTORY) {
		alphaInterest=2;
		for (i=0; i<maxTime[alphaInterest]; i++)
			if (value[alphaInterest,i]>0)
				print alphaValues[i]," ",i," ",(value[alphaInterest,i]/counter[alphaInterest,i])
	}

	if (TRACE_CONVERGENCE_VALUES) {
		for (i=1; i<=6; i++)
			if (numSamples[i]>0)
				print alphaValues[i]," ",i," ",(pp[i]/numSamples[i])," ",(sa[i]/numSamples[i])," ",un[i]," ",k[i]
	}

}
