const StepFormattedText = ({ content, currentWordIndex }) => {
  const cleaned = content
    .replace(/^###\s*/gm, '')
    .replace(/\\\\/g, '\\')
    .replace(/(\d+\.\s)/g, '\n$1')
    .replace(/(Step\s*\d+[:.])/gi, '\n$1');

  const lines = cleaned.split('\n').filter((line) => line.trim() !== '');
  const lightColors = ['#FCE7F3', '#E0F2FE', '#FEF9C3', '#DCFCE7', '#EDE9FE', '#FFF4E5'];

  let globalWordIndex = 0;

  return (
    <View style={styles.stepContainer}>
      {lines.map((line, i) => {
        const words = line.split(/\s+/);
        const isStep = /^(Step\s*\d+[:.]|^\d+[.:])/i.test(line);
        const stepColor = lightColors[i % lightColors.length];

        return (
          <View
            key={i}
            style={[
              styles.stepBlock,
              { backgroundColor: isStep ? stepColor : 'transparent' },
            ]}
          >
            <Text style={styles.stepText}>
              {words.map((word, j) => {
                const index = globalWordIndex + j;
                const highlight = index === currentWordIndex;
                return (
                  <Text
                    key={j}
                    style={{
                      backgroundColor: highlight ? '#FFD54F' : 'transparent',
                      color: highlight ? '#000' : '#111',
                    }}
                  >
                    {word + ' '}
                  </Text>
                );
              })}
              {(() => {
                globalWordIndex += words.length;
                return null;
              })()}
            </Text>
          </View>
        );
      })}
    </View>
  );
};
