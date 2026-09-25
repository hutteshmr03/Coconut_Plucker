import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Star } from 'lucide-react';

export const ReviewModal = ({ isOpen, onClose, booking, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!booking) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(booking.id, rating, comment.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rate Professional for ${booking.booking_number}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleSubmit}>
            Submit Review
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center', margin: '16px 0 24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '700',
              color: 'var(--ink-soft)',
              marginBottom: '12px',
              textTransform: 'uppercase'
            }}
          >
            How was the quality and safety of work?
          </label>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <Star
                  size={32}
                  fill={star <= rating ? 'var(--gold)' : 'none'}
                  color={star <= rating ? 'var(--gold)' : 'var(--line)'}
                />
              </button>
            ))}
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--ink)',
              marginTop: '8px'
            }}
          >
            {rating === 5 && '★★★★★ Outstanding Service'}
            {rating === 4 && '★★★★☆ Great Job'}
            {rating === 3 && '★★★☆☆ Satisfactory'}
            {rating === 2 && '★★☆☆☆ Needs Improvement'}
            {rating === 1 && '★☆☆☆☆ Unsatisfactory'}
          </div>
        </div>

        <div className="field">
          <label>Your Feedback / Comment (Optional)</label>
          <textarea
            placeholder="Describe the punctuality, safety gear, and tree care provided by the climber..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </div>
      </form>
    </Modal>
  );
};
