import React from 'react';

export default function DummyUIBlocks({ palette }) {
  return (
    <div className="dummy-ui-blocks">
      <div className="block" style={{ background: palette[0] }}>Button</div>
      <div className="block" style={{ background: palette[1] }}>Input</div>
      <div className="block" style={{ background: palette[2] }}>Card</div>
    </div>
  );
}
