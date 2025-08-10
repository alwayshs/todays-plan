export function buildPrompt({ interest, region, goal, isPaid, weatherSummary }) {
  return `사용자 관심사: ${interest}
지역: ${region}
목표: ${goal}
${weatherSummary}

당신은 짧고 실행 가능한 '오늘의 액션'을 10개까지 생성하는 전문가입니다. 각각은 실제로 지금 당장 할 수 있도록 구체적인 단계(예: 문자 보내기, SNS 포스팅 템플릿, 5분 안에 할 수 있는 행동 등)를 포함하고, 예상 소요 시간과 우선순위(1~3)도 표기하세요. 유료(PDF) 요청(isPaid=true)일 경우 각 액션에 대해 1~2줄의 이유와 성공 확률(간단히 퍼센트로)을 추가하세요. 출력은 한국어로 하세요.`;
}
